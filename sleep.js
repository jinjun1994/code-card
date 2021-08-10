const sleep = async (delay) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};
(async () => {
  await sleep(6000);
  console.log(1);
})()(async () => {
  console.log(2);
  await sleep(6000);
  console.log(3);
})();
