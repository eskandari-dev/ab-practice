// puts a React element where {token} is in a translated sentence
export function withNode(text, token, node) {
  const [before, after = ''] = text.split(token)
  return <>{before}{node}{after}</>
}
