let arr = [
    {id: 1, name: '部门1', pid: 0},
    {id: 2, name: '部门2', pid: 1},
    {id: 3, name: '部门3', pid: 1},
    {id: 4, name: '部门4', pid: 3},
    {id: 5, name: '部门5', pid: 4},
]

const getChildren = (data, result, pid) => {
  for (const item of data) {
    if (item.pid === pid) {
      const newItem = {...item, children: []};
      result.push(newItem);
      getChildren(data, newItem.children, item.id);
    }
  }
}


const arrayToTree = (data, pid) => {
  const result = [];
  getChildren(data, result, pid)
  return result;
}
arrayToTree(arr,0)

function tree(arr, pid = 0) {
 return arr.filter(_ => _.pid == pid).map(_ => ({..._, children: tree(arr, _.id)}))
}
tree(arr)