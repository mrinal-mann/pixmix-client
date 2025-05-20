// This file serves as a redirect to the result component to help with routing
import { Redirect } from 'expo-router';

export default function ResultIndex() {
  return <Redirect href="/result" />;
}