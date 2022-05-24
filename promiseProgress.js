function allProgress(proms, progress_cb) {
    let d = 0;
    progress_cb(0);
    for (const p of proms) {
      p.then(()=> {    
        d ++;
        progress_cb( (d * 100) / proms.length );
      });
    }
    return Promise.all(proms);
  }
  
  function test(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
         console.log(`Waited ${ms}`);
         resolve();
       }, ms);
    });
  }
  
 const arr =  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => {
     return test(i * 1000).then(() => {
        console.log(`Done ${i}`);
      });
    });

  
  allProgress(arr,
    (p) => {
       console.log(`% Done = ${p.toFixed(2)}`);
  });