import type { SVGProps } from "react";

const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  students:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  book: "M12 5v16 M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v17h-5a4 4 0 0 0-4 1 4 4 0 0 0-4-1H3z",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  refresh:
    "M20 7v5h-5 M4 17v-5h5 M6.09 7a7 7 0 0 1 11.55-2.61L20 7 M4 17l2.36 2.61A7 7 0 0 0 17.91 17",
  plus: "M12 5v14 M5 12h14",
  layers: "m12 3 9 5-9 5-9-5z M3 12l9 5 9-5 M3 16l9 5 9-5",
  login: "M9 5H5v14h4 M13 3h6v18h-6 M8 12h9 M14 9l3 3-3 3",
  chevron: "m9 5 7 7-7 7",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  warning: "m12 3 10 18H2z M12 9v5 M12 17h.01",
  logout: "M9 5H5v14h4 M13 3h6v18h-6 M8 12h9 M11 9l-3 3 3 3",
  lock: "M6 10h12v11H6z M8 10V7a4 4 0 0 1 8 0v3 M12 14v3",
  eye: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  check: "m5 12 4 4L19 6",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  close: "m6 6 12 12 M6 18 18 6",
  edit: "m16 3 5 5-12 12-6 1 1-6z M13 6l5 5",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  mail: "M3 5h18v14H3z m0 0 9 8 9-8",
  phone: "M7 3H3c0 10 8 18 18 18v-4l-5-2-2 2a15 15 0 0 1-7-7l2-2z",
} as const;

export type IconName = keyof typeof paths;

export default function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
