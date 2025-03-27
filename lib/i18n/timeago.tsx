import * as timeago from 'timeago.js';

import timeagoEs from 'timeago.js/lib/lang/es';
import timeagoJa from 'timeago.js/lib/lang/ja';
import timeagoRu from 'timeago.js/lib/lang/ru';
import timeagoZh from 'timeago.js/lib/lang/zh_CN';

timeago.register('es', timeagoEs);
timeago.register('ja', timeagoJa);
timeago.register('ru', timeagoRu);
timeago.register('zh', timeagoZh);

export { timeago };
