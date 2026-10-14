function QuestionImage({ image, className = '' }) {
  if (!image) return null
  return (
    <div className={'question-image' + (className ? ' ' + className : '')}>
      <img src={'/signs/' + image + '.png'} alt="" />
    </div>
  )
}

export default QuestionImage
