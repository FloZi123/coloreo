import LegalPage from "@/components/LegalPage";
export default function Page(props: { params: Promise<{ locale: string }> }) {
  return <LegalPage params={props.params} legalKey="widerruf" />;
}
