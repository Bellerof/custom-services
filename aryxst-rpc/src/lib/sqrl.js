import Sqrl from 'squirrelly';

Sqrl.filters.define('getProperty', (object, property) => {
 if (!object) return;
 return object[property];
});

export default Sqrl;
