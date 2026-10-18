export interface BusinessInfo {
  id: string
  name: string
  description: string
  address: string
  phone: string
  socialNetworks: string[]
  openingHours: string[]
}

export interface EnquiryInput {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    fields?: Record<string, string[]>
  }
}
