export default `# scroll down to see all code

layout
    name: breadthfirst 

n1
    background: green

connect n1 - n2
connect n1 - n3

step

n1
    background: red
n2
    background: blue

connect n1 - n2
    line-style: dashed 


step

n3
    background: blue
n2
    background: red

connect n1 - n4
    line-color: blue

step

n1
    background: blue


   

`;