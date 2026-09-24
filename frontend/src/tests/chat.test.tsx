import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { addDays, todayISO } from '../utils/dates'
import { jsonResponse, mockFetch, reply } from './helpers'

const ask = async (text: string) => {
    await userEvent.type(screen.getByLabelText('Your message'), `${text}{enter}`)
}

const availability = {
    check_in: '2026-11-10',
    check_out: '2026-11-12',
    adults: 2,
    nights: 2,
    options: [
        {
            room_id: 'deluxe-king',
            name: 'Deluxe King',
            capacity: 2,
            rooms_left: 1,
            price_per_night: 12500,
            total_price: 25000,
            nights: 2,
            features: ['Sea view'],
        },
    ],
}

describe('Chat app', () => {
    it('shows the welcome message and suggested questions', () => {
        mockFetch()
        render(<App />)
        expect(screen.getByText(/Welcome to Azure Bay/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Is breakfast included?' })).toBeInTheDocument()
    })

    it('shows a loading indicator, then the answer', async () => {
        const f = mockFetch()
        let resolve!: (r: Response) => void
        f.mockReturnValueOnce(new Promise<Response>((r) => (resolve = r)))
        render(<App />)

        await userEvent.click(screen.getByRole('button', { name: 'What time is check-in?' }))
        expect(await screen.findByRole('status', { name: /typing/i })).toBeInTheDocument()

        resolve(jsonResponse(reply({ message: 'Check-in is from 3:00 PM.' })))
        expect(await screen.findByText('Check-in is from 3:00 PM.')).toBeInTheDocument()
        expect(screen.queryByRole('status', { name: /typing/i })).not.toBeInTheDocument()
    })

    it('shows a network error and recovers on retry', async () => {
        const f = mockFetch()
        f.mockRejectedValueOnce(new TypeError('Failed to fetch'))
        f.mockResolvedValueOnce(jsonResponse(reply({ message: 'Breakfast costs ₹1,200.' })))
        render(<App />)

        await ask('Is breakfast included?')
        expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't reach/i)

        await userEvent.click(screen.getByRole('button', { name: /try again/i }))
        expect(await screen.findByText('Breakfast costs ₹1,200.')).toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getAllByText('Is breakfast included?')).toHaveLength(1) // no duplicate bubble
    })

    it('renders a backend model failure as an error with retry', async () => {
        mockFetch().mockResolvedValue(
            jsonResponse(reply({ type: 'error', message: 'The assistant is temporarily unavailable.' })),
        )
        render(<App />)
        await ask('Hello')
        expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily unavailable/)
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('reuses the session id for follow-up questions', async () => {
        const f = mockFetch()
        f.mockResolvedValueOnce(jsonResponse(reply({ message: 'Check-in is 3 PM.', session_id: 'abc' })))
        f.mockResolvedValueOnce(jsonResponse(reply({ message: 'Check-out is 11 AM.', session_id: 'abc' })))
        render(<App />)

        await ask('What time is check-in?')
        await screen.findByText('Check-in is 3 PM.')
        await ask('And check-out?')
        await screen.findByText('Check-out is 11 AM.')

        const second = JSON.parse(f.mock.calls[1][1].body)
        expect(second.session_id).toBe('abc')
        expect(second.message).toBe('And check-out?')
    })

    it('renders availability results with rupee prices', async () => {
        mockFetch().mockResolvedValue(
            jsonResponse(reply({ type: 'availability', message: 'Good news! Rooms are available.', availability })),
        )
        render(<App />)
        await ask('Rooms for 2?')

        expect(await screen.findByRole('heading', { name: 'Deluxe King' })).toBeInTheDocument()
        expect(screen.getByText('₹12,500')).toBeInTheDocument()
        expect(screen.getByText('₹25,000 total')).toBeInTheDocument()
        expect(screen.getByText('Only 1 left')).toBeInTheDocument()
        expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
    })

    it('opens the form when details are missing and sends structured availability', async () => {
        const f = mockFetch()
        f.mockResolvedValueOnce(
            jsonResponse(
                reply({
                    type: 'needs_input',
                    message: 'Which dates and how many guests?',
                    missing_fields: ['check_in', 'check_out'],
                }),
            ),
        )
        f.mockResolvedValueOnce(jsonResponse(reply({ type: 'availability', message: 'Good news!', availability })))
        render(<App />)

        await ask('Any rooms next weekend?')
        expect(await screen.findByRole('form', { name: /check room availability/i })).toBeInTheDocument()

        const ci = addDays(todayISO(), 10)
        fireEvent.change(screen.getByLabelText(/^check-in/i), { target: { value: ci } })
        await userEvent.click(screen.getByRole('button', { name: 'Search rooms' }))

        expect(await screen.findByRole('heading', { name: 'Deluxe King' })).toBeInTheDocument()
        const body = JSON.parse(f.mock.calls[1][1].body)
        expect(body.availability).toEqual({ check_in: ci, check_out: addDays(ci, 1), adults: 2 })
    })
})