import { useLang } from '../lang-context.js'
import { fill } from '../regions-data.js'
import { ClockIcon, ExamIcon, CheckIcon } from './Icons.jsx'

function TestFormat({ rules }) {
  const { t } = useLang()
  if (!rules) return null

  return (
    <div className="test-format">
      <span className="format-title">{t.format.title}</span>
      <span className="format-pill"><ExamIcon size={15} /> {fill(t.format.questions, rules.questions)}</span>
      <span className="format-pill"><CheckIcon /> {fill(t.format.pass, rules.pass_correct)}</span>
      <span className="format-pill">
        <ClockIcon /> {rules.time_limit ? fill(t.format.minutes, rules.time_limit) : t.format.noTime}
      </span>
      {rules.sections.map((section, index) =>
        section.pass_correct > 0 ? (
          <span className="format-pill format-part" key={section.key}>
            {fill(t.format.part, index + 1)}: {section.pass_correct}/{section.questions}
          </span>
        ) : null,
      )}
    </div>
  )
}

export default TestFormat
