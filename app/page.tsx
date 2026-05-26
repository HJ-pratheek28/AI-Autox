import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect first-time visitors to the Google OAuth Consent Login Gateway
  redirect('/login');
}
