export default `
layout
	name: circle
	animate: false


6 nodes
	background-color: black
	border-width: 4
	border-color: white

all nodes with all nodes
	line-color: black

all nodes    
	label: ""  

step 

n3
	background-color: red

step

n3 with n1,n6,n5
	line-color: red
	line-style: dashed
	
step 

n1,n6,n5
	background-color: red
	
step 

n1,n6,n5 with all nodes
	line-color: red
	line-style: dashed

step

all nodes 
	background-color: red
	
step

all edges
	line-color: red
	line-style: dashed

step



`;