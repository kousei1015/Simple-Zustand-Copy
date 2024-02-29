import useStore from "./useStore";
const Increment = () => {
  console.log("Increment");
  const increment = useStore((state) => state.increase);
  return <div onClick={increment}>Increment</div>;
};

export default Increment;
