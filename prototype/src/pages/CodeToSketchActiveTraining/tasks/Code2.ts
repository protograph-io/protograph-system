export default `n1
  label: "start"
  color: blue

n2, n3, n4
  label: ""
  color: grey

n5
  label: "end"
  color: black

n1 - n2

n2 - n2
  label: "a , b"

n2 - n3
  label: "a"

n3 - n4
  label: "b"

n4 - n5
  label: "b"

align n1, n2, n3, n4, n5 horizontally




`;