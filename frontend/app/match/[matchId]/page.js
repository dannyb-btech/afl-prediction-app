import MatchDetailsClient from './MatchDetailsClient';

// Generate static params for static export
export async function generateStaticParams() {
  // Return empty array - pages will be generated on-demand
  return [];
}

export default function MatchDetails({ params }) {
  return <MatchDetailsClient matchId={params.matchId} />;
} 