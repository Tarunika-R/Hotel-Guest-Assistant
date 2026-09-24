import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AvailabilityForm from '../components/AvailabilityForm'
import { addDays, todayISO } from '../utils/dates'

const setup = () => {
    const onSubmit = vi.fn()
    render(<AvailabilityForm onSubmit={onSubmit} onClose={() => { }} />)
    return { onSubmit }
}

describe('AvailabilityForm', () => {
    it('requires both dates', async () => {
        const { onSubmit } = setup()
        await userEvent.click(screen.getByRole('button', { name: 'Search rooms' }))
        expect(screen.getByText('Choose a check-in date')).toBeInTheDocument()
        expect(screen.getByText('Choose a check-out date')).toBeInTheDocument()
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('rejects a past check-in date', async () => {
        const { onSubmit } = setup()
        fireEvent.change(screen.getByLabelText(/^check-in/i), { target: { value: '2020-01-01' } })
        await userEvent.click(screen.getByRole('button', { name: 'Search rooms' }))
        expect(screen.getByText('Check-in cannot be in the past')).toBeInTheDocument()
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('rejects check-out that is not after check-in', async () => {
        const { onSubmit } = setup()
        const ci = addDays(todayISO(), 10)
        fireEvent.change(screen.getByLabelText(/^check-in/i), { target: { value: ci } })
        fireEvent.change(screen.getByLabelText(/^check-out/i), { target: { value: ci } })
        await userEvent.click(screen.getByRole('button', { name: 'Search rooms' }))
        expect(screen.getByText('Check-out must be after check-in')).toBeInTheDocument()
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('submits valid dates and guest count', async () => {
        const { onSubmit } = setup()
        const ci = addDays(todayISO(), 10)
        fireEvent.change(screen.getByLabelText(/^check-in/i), { target: { value: ci } })
        fireEvent.change(screen.getByLabelText(/^check-out/i), { target: { value: addDays(ci, 3) } })
        await userEvent.click(screen.getByRole('button', { name: 'More guests' }))
        await userEvent.click(screen.getByRole('button', { name: 'Search rooms' }))
        expect(onSubmit).toHaveBeenCalledWith({ check_in: ci, check_out: addDays(ci, 3), adults: 3 })
    })
})