import { labels } from './src/app/(process)/[organization]/consultations/data/data';
declare global {
  type Consultation =  {
    id: string
    subject: string
    status: string
    label: string
    priority: string
  }
}

export default global