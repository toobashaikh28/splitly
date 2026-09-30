import Logo from "./Logo.jsx";

// A worked example of the product's core idea, shown on the auth screens.
// Ali: half the steak (100) + 7% tax on it = 107.00
// Sara: half the steak (100) + salad (80) = 180, + 7% tax = 192.60
const SPECIMEN = [
  { item: "Steak", price: "200.00", who: "Ali, Sara" },
  { item: "Salad", price: "80.00", who: "Sara" },
];

const POINTS = [
  { n: "01", text: "Split by item, not by head" },
  { n: "02", text: "Tax shared in proportion" },
  { n: "03", text: "Settle up with a tap" },
];

function Row({ left, right, className = "" }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${className}`}>
      <span>{left}</span>
      <span className="tnum">{right}</span>
    </div>
  );
}

function ReceiptSpecimen() {
  return (
    <div aria-hidden="true" className="w-full max-w-xs">
      <div className="bg-white px-5 pb-5 pt-5 font-mono text-[12.5px] leading-5 text-ink">
        <div className="flex items-center justify-between">
          <span className="font-semibold uppercase tracking-wide">Coconet Grove</span>
          <span className="text-subtle">Example</span>
        </div>
        <div className="perforation my-3" />
        {SPECIMEN.map(({ item, price, who }) => (
          <div key={item} className="mb-2 last:mb-0">
            <Row left={item} right={price} />
            <div className="text-subtle">↳ {who}</div>
          </div>
        ))}
        <div className="perforation my-3" />
        <Row left="Subtotal" right="280.00" />
        <Row left="Tax 7%" right="19.60" />
        <div className="perforation my-3" />
        <div className="mb-1 text-subtle">Each person's share</div>
        <Row left="Ali" right="107.00" className="font-semibold" />
        <Row left="Sara" right="192.60" className="font-semibold" />
      </div>
      {/* torn edge */}
      <svg width="100%" height="8" className="block">
        <defs>
          <pattern id="receipt-tear" width="16" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 0h16L8 8z" fill="#fff" />
          </pattern>
        </defs>
        <rect width="100%" height="8" fill="url(#receipt-tear)" />
      </svg>
    </div>
  );
}

/**
 * Two-panel layout for signed-out screens. The left panel carries the
 * product idea (large screens only); the right holds the form.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-primary p-12 text-white lg:flex">
        <Logo inverted />
        <div>
          <p className="max-w-md text-display font-semibold text-white">Split what people actually ordered.</p>
          <p className="mt-4 max-w-md text-heading text-white/80">
            Assign each item to the people who had it. Tax is shared in proportion, so nobody covers someone else's steak.
          </p>
          <div className="mt-10">
            <ReceiptSpecimen />
          </div>
        </div>
        <ul className="grid max-w-lg grid-cols-3 gap-6 border-t border-white/20 pt-6">
          {POINTS.map(({ n, text }) => (
            <li key={n}>
              <p className="font-mono text-micro uppercase tracking-wide text-white/60">{n}</p>
              <p className="mt-1.5 text-small text-white/85">{text}</p>
            </li>
          ))}
        </ul>
      </aside>

      <main id="main" className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-start pb-10 pt-8 sm:justify-center sm:py-10">{children}</div>
      </main>
    </div>
  );
}
