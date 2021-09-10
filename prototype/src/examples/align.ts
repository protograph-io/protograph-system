export default `

add 6 nodes
	background-color: black
n1,n6,n5 
	will-be-removed: true
connect all nodes with all nodes
	line-color: black
    label: ""

n1,n5
    background-color: green

n2,n4
    background-color: blue

align n1,n5 horizontally 
align n2,n4 vertically 

step 

n3 
	background-color: red

step

n3 with (nodes where will-be-removed = true)
	line-color: red
	line-style: dashed

step 

select (nodes where will-be-removed = true)
	background-color: red

`