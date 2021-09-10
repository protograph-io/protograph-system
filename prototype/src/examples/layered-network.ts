export default `
layout 
    name: preset

1 nodes 
    layer: 1

3 nodes
    layer: 2
    
3 nodes
    layer: 3

1 nodes
    layer: 4
 
all nodes
    background-color: black
    
arrangemlp 

step

connect (select nodes where layer is 1) -> (select nodes where layer is 2)
    label: ""
 
step
 
connect (select nodes where layer is 2) -> (select nodes where layer is 3)
    label: ""

step

connect (select nodes where layer is 3) -> (select nodes where layer is 4)
    label: ""

`;