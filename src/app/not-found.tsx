import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Not found</h1>
          <div className="subtitle">That page doesn't exist.</div>
        </div>
      </div>
      <p>
        <Link href="/today">Go to today</Link>
      </p>
    </>
  );
}
