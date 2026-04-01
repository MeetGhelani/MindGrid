interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Read the board",
    body: "Goals finish the puzzle. Traps fail instantly. Doors need switches. Gates depend on gravity.",
  },
  {
    title: "Plan every action",
    body: "Moves are limited. Wrong order can leave you trapped, out of moves, or with the wrong doors open.",
  },
  {
    title: "Use rules late",
    body: "Gravity flips are scarce and invert vertical movement. Save them for the exact moment they unlock the route.",
  },
];

export default function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="How to play">
      <section className="tutorial-modal">
        <div className="tutorial-header">
          <div>
            <span className="tutorial-kicker">How To Play</span>
            <h2>Think before every move</h2>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="tutorial-steps">
          {steps.map((step, index) => (
            <article key={step.title} className="tutorial-card">
              <span className="tutorial-index">0{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>

        <button type="button" className="primary-action tutorial-action" onClick={onClose}>
          <span>Enter Puzzle</span>
          <small>Adults only difficulty</small>
        </button>
      </section>
    </div>
  );
}
