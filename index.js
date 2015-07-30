import path from 'path';
import fs from 'mz/fs';
import gm from 'gm';
import koa from 'koa';
import Router from 'koa-router';
import uuid from 'uuid';
import {isFinite, contains} from 'lodash';

const app = koa();
const router = new Router();

router.get('/:id', function *() {
  const userAgent = (this.get('user-agent') || '').toLowerCase();
  let format = 'jpeg';
  if (~userAgent.indexOf('chrome')) {
    format = 'webp';
  } else if (~userAgent.indexOf('safari')) {
    format = 'jp2';
  }
  let {w, h} = this.query;
  w = parseInt(w, 10);
  h = parseInt(h, 10);
  if (isFinite(w) && isFinite(h)) {
    const resultName = path.join('storage', `${this.params.id}_${w}x${h}.${format}`);
    if (yield fs.exists(resultName)) {
      this.type = `image/${format}`;
      this.body = fs.createReadStream(resultName);
    } else {
      const sourceName = path.join('storage', this.params.id);
      if (yield fs.exists(sourceName)) {
        this.type = `image/${format}`;
        const stream = gm(sourceName).thumbnail(w, h).quality(85).stream(format);
        stream.pipe(fs.createWriteStream(resultName));
        this.body = stream;
      }
    }
  }
});

router.post('/', function *() {
  if (this.is('image/*')) {
    const id = uuid.v1();
    const sourceName = path.join('storage', id);
    this.req.pipe(fs.createWriteStream(sourceName));
    this.redirect(`/${id}`);
  } else {
    this.status = 400;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
console.log('listening on 3000');
