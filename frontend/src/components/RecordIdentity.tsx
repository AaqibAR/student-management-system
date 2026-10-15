import Icon from "./Icon";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export function RecordDate({ value }: { value: string }) {
  return Number.isNaN(Date.parse(value)) ? (
    <span>—</span>
  ) : (
    <time dateTime={value}>{dateFormat.format(new Date(value))}</time>
  );
}
export default function RecordIdentity({
  name,
  code,
  course = false,
}: {
  name: string;
  code: string;
  course?: boolean;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.slice(0, 1))
    .join("")
    .toUpperCase();
  return (
    <div className="record-identity">
      <span
        className={`record-avatar ${course ? "is-course" : ""}`}
        aria-hidden="true"
      >
        {course ? <Icon name="book" /> : initials}
      </span>
      <div>
        <strong>{name}</strong>
        <span>{code}</span>
      </div>
    </div>
  );
}
