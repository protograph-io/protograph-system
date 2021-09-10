export default `
fattree
    label: ""

select (nodes where level = core)
    background-color: salmon

select (nodes where level = agg)
    background-color: orange

select (nodes where level = edge)
    background-color: tan

select (nodes where level = host)
    background-color: green

select (nodes where edge = 1 and side = left)
    background-color: red
select (nodes where edge = 7 and side = left) 
    background-color: red

path (nodes where level = host and edge = 1 and side = left) to (nodes where level = host and edge = 7 and side = left) 
    line-color: red



`;