import { redirect } from "next/navigation";

type AccessPageProps = {
  searchParams: {
    session_id?: string;
  };
};

export default function AccessPage({ searchParams }: AccessPageProps) {
  const query = searchParams.session_id
    ? `?session_id=${encodeURIComponent(searchParams.session_id)}`
    : "";
  redirect(`/success${query}`);
}

