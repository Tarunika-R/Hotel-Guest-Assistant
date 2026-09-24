export type ResponseType = 'answer' | 'availability' | 'needs_input' | 'fallback' | 'error'

export interface AvailabilityQuery {
    check_in: string // YYYY-MM-DD
    check_out: string
    adults: number
}

export interface RoomOption {
    room_id: string
    name: string
    capacity: number
    rooms_left: number
    price_per_night: number
    total_price: number
    nights: number
    features: string[]
}

export interface AvailabilityResult extends AvailabilityQuery {
    nights: number
    options: RoomOption[]
}

export interface ChatRequest {
    session_id?: string
    message: string
    availability?: AvailabilityQuery
}

export interface ChatResponse {
    request_id: string
    session_id: string
    type: ResponseType
    message: string
    availability: AvailabilityResult | null
    missing_fields: string[]
}

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    type?: ResponseType
    availability?: AvailabilityResult | null
    missingFields?: string[]
    failed?: boolean // true for errors that can be retried
}