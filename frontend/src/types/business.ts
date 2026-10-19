export interface BusinessInfo {
  id: string
  name: string
  description: string
  address: string
  phone: string
  socialNetworks: string[]
  openingHours: string[]
}

export type BusinessInfoInput = Omit<BusinessInfo, 'id'>

export interface EnquiryInput {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

// Mismos valores que `EnquiryStatus` en el backend.
export type EnquiryStatus = 'PENDING' | 'READ' | 'RESOLVED'

export interface Enquiry extends EnquiryInput {
  id: string
  status: EnquiryStatus
  createdAt: string
}
