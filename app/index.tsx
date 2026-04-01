import { Redirect } from 'expo-router';

export default function Index() {
  // Automatically redirect the root URL to the login screen inside the tabs folder
  return <Redirect href="/tabs" />;
}
