import useStore from "./useStore"
const App = () => {
  const count = useStore((state) => (state.count))
  console.log("count")
  return (
    <div>{count} </div>
  )
}

export default App