export interface User {
  id: number
  name: string
  email: string
  phone: string
  dob: string
  tob: string
  menh: string
  focusArea: string | null
  referralCode: string | null
  referredByCode: string | null
}

export interface NguHanhResult {
  score: number
  c_sinh: number
  c_hop: number
  c_khac: number
  rating: string
  details: string
}

export interface VanQueResult {
  score: number
  rating: string
  tienVanQue: number
  trungVanQue: number
  hauVanQue: number
  details: string
}

export interface FengshuiResult {
  menh: string
  nguHanh: NguHanhResult
  vanQue: VanQueResult
  totalScore: number
  hexagrams: {
    cleaned: { tien: string; trung: string; hau: string }
  }
  aiAnalysis: string | null
}

export interface FengshuiCheckResponse {
  user: User
  result: FengshuiResult
}

export interface Order {
  id: number
  userId: number
  packageType: '200k' | '500k'
  amount: number
  paymentCode: string
  status: 'pending' | 'paid' | 'expired' | 'completed'
  carrier: string | null
  consultationTopic: string | null
  createdAt: string
}

export interface ChatMessage {
  id: number
  roomId: number
  senderType: 'user' | 'admin' | 'system'
  message: string
  createdAt: string
}

export interface ChatRoom {
  id: number
  orderId: number
  status: string
  sourceType?: 'direct' | 'referral'
  createdAt: string
  order?: Order & { user?: User }
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface LookupOrderItem {
  id: number
  packageType: '200k' | '500k'
  status: 'paid' | 'completed'
  createdAt: string
  carrier: string | null
  consultationTopic: string | null
  chatRoomId: number | null
  sourceType: 'direct' | 'referral' | null
}

export interface LookupResponse {
  user: {
    id: number
    name: string
    phone: string
    menh: string
    focusArea: string | null
    referralCode: string | null
    lastCheckResult: string | null
  }
  orders: LookupOrderItem[]
}
