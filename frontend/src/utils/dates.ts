const pad = (n: number) => String(n).padStart(2, '0')

/** Local-date YYYY-MM-DD (avoids the UTC shift of toISOString). */
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const parse = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
}

export const todayISO = () => toISO(new Date())

export const addDays = (iso: string, n: number) => {
    const d = parse(iso)
    d.setDate(d.getDate() + n)
    return toISO(d)
}

export const formatShort = (iso: string) =>
    parse(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const formatRange = (checkIn: string, checkOut: string) =>
    `${formatShort(checkIn)} to ${parse(checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`