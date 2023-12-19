/* Simple Analytics - Privacy friendly analytics (docs.simpleanalytics.com/script; 2023-05-03; 10ee; SRI-version; v11) */
!(function (l, t, e, n, p) {
  try {
    var h = undefined,
      f = !0,
      d = !1,
      r = 'true',
      a = 'https:',
      m = 'pageview',
      u = 'event',
      i = 'error',
      o = l.console,
      c = 'doNotTrack',
      g = l.navigator,
      s = l.location,
      v = s.host,
      y = l.document,
      _ = g.userAgent,
      w = 'Not sending request ',
      b = w + 'when ',
      E = d,
      O = encodeURIComponent,
      x = decodeURIComponent,
      S = JSON.stringify,
      M = l.addEventListener,
      k = 'https://queue.' + e,
      q = y.documentElement || {},
      A = 'language',
      $ = 'Height',
      j = 'scroll',
      D = g.userAgentData,
      C = j + $,
      R = 'offset' + $,
      H = 'client' + $,
      P = 'pagehide',
      T = 'platform',
      U = 'platformVersion',
      I = 'https://docs.simpleanalytics.com',
      V = 0,
      B = /(bot|spider|crawl)/i.test(_) && !/(cubot)/i.test(_),
      N = l.screen,
      z = y.currentScript || y.querySelector('script[src*="' + e + '"]');
    p = function () {
      var t = [].slice.call(arguments);
      return t.unshift('Simple Analytics:'), Function.prototype.apply.call(o.warn, o, t);
    };
    var F = function (t, e) {
        p('Error in your ' + t + ' function:', e);
      },
      W = function (t, e) {
        return Object.prototype.hasOwnProperty.call(t, e);
      },
      G = function (t) {
        return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      },
      J = function (t, e) {
        return t && t.getAttribute('data-' + e);
      },
      L = function (t) {
        return Array.isArray(t) ? t : 'string' == typeof t && t.length ? t.split(/, ?/) : [];
      },
      Y = function (t) {
        return t && t.constructor === Object;
      },
      Z = function () {
        for (var t = {}, e = arguments, n = 0; n < e.length; n++) {
          var r = e[n];
          if (Y(r)) for (var a in r) W(r, a) && (t[a] = r[a]);
        }
        return t;
      },
      K = l.sa_settings,
      Q = K || Object.keys(t).length;
    (t = Z(t, K)), Q && p('Settings', t);
    var X = L(t.ignoreMetrics || J(z, 'ignore-metrics')),
      tt = function (e) {
        return (
          0 ===
          X.filter(function (t) {
            return new RegExp('^' + e).test(t);
          }).length
        );
      },
      et = Date.now,
      nt = function () {
        var e = l.crypto || l.msCrypto,
          t = [1e7] + -1e3 + -4e3 + -8e3 + -1e11,
          n = /[018]/g;
        try {
          return t.replace(n, function (t) {
            return (t ^ (e.getRandomValues(new Uint8Array(1))[0] & (15 >> (t / 4)))).toString(16);
          });
        } catch (r) {
          return t.replace(n, function (t) {
            var e = (16 * Math.random()) | 0;
            return (t < 2 ? e : (3 & e) | 8).toString(16);
          });
        }
      },
      rt = function (t) {
        return 'function' == typeof t;
      },
      at = 'namespace',
      it = t[at] || J(z, at) || 'sa',
      ot = l[it + '_metadata'],
      ct = function (t, e) {
        Y(ot) && (t = Z(t, ot));
        var n = l[Mt];
        if (!rt(n)) return t;
        try {
          return Z(t, n.call(l, Z(t, e)));
        } catch (r) {
          F('metadata', r);
        }
      },
      st = t.strictUtm || J(z, 'strict-utm') == r,
      ut = function (a) {
        return (
          s.search
            .slice(1)
            .split('&')
            .filter(function (t) {
              var e = a || !tt('ut'),
                n = Ot.map(G).join('|'),
                r = e
                  ? '^(' + n + ')='
                  : '^((utm_)' +
                    (st ? '' : '?') +
                    '(source|medium|content|term|campaign)' +
                    (st ? '' : '|ref') +
                    '|' +
                    n +
                    ')=';
              return e && !Ot.length ? d : new RegExp(r).test(t);
            })
            .join('&') || h
        );
      },
      lt = it + '_loaded';
    if (l[lt] == f) return p(w + 'twice');
    (l.sa_event_loaded = f), (l[lt] = f);
    var pt = function (e, t, n) {
        (e = n ? e : Z(At, Dt, e)), g.brave && !n && (e.brave = f), g._duckduckgoloader_ && !n && (e.duck = f);
        var r = new Image();
        t && ((r.onerror = t), (r.onload = t)),
          (r.src =
            k +
            '/simple.gif?' +
            Object.keys(e)
              .filter(function (t) {
                return e[t] != h;
              })
              .map(function (t) {
                return O(t) + '=' + O(e[t]);
              })
              .join('&') +
            '&time=' +
            Date.now());
      },
      ht = t.hostname || J(z, 'hostname'),
      ft = ht || v,
      dt = { version: 'cdn_latest_11', hostname: ft };
    (n = function (t) {
      (t = t.stack ? t + ' ' + t.stack : t), p(t), pt(Z(dt, { type: i, error: t, path: s.pathname }), h, f);
    }),
      M(
        i,
        function (t) {
          t.filename && -1 < t.filename.indexOf(e) && n(t.message);
        },
        d,
      );
    var mt,
      gt = et(),
      vt = 0,
      yt = t.mode || J(z, 'mode'),
      _t =
        !!(ee = t.collectDnt) === ee
          ? t.collectDnt
          : J(z, 'ignore-dnt') == r || J(z, 'skip-dnt') == r || J(z, 'collect-dnt') == r,
      wt = !('false' == J(z, 'auto-collect') || t.autoCollect === d),
      bt = t.saGlobal || J(z, 'sa-global') || it + '_' + u,
      Et = L(t.ignorePages || J(z, 'ignore-pages')),
      Ot = L(t.allowParams || J(z, 'allow-params')),
      xt = L(t.nonUniqueHostnames || J(z, 'non-unique-hostnames')),
      St = t.pathOverwriter || J(z, 'path-overwriter'),
      Mt = t.metadataCollector || J(z, 'metadata-collector');
    try {
      mt = tt('c') ? Intl.DateTimeFormat().resolvedOptions().timeZone : h;
    } catch (ne) {
      p(ne);
    }
    var kt =
        g.webdriver ||
        l.__nightmare ||
        l.callPhantom ||
        l._phantom ||
        l.phantom ||
        l.__polypane ||
        l._bot ||
        B ||
        Math.random() == Math.random(),
      qt = tt('t') || tt('scro');
    kt && (dt.bot = f);
    var At = Z(dt, {
      ua: tt('us') ? _ : h,
      https: s.protocol == a,
      timezone: mt,
      page_id: qt ? nt() : h,
      session_id: tt('se') ? nt() : h,
    });
    if (
      ((At.sri = f),
      D && ((At.mobile = D.mobile), (At.brands = S(D.brands))),
      y.doctype || p('Add DOCTYPE html for accurate dimensions'),
      ft !== v && (At.hostname_original = v),
      !_t && c in g && '1' == g[c])
    )
      return p(b + c + ' is enabled. See ' + I + '/dnt');
    (-1 != v.indexOf('.') && !/^[0-9.:]+$/.test(v)) ||
      ht ||
      p('Set hostname on ' + v + '. See ' + I + '/overwrite-domain-name');
    var $t,
      jt,
      Dt = {},
      Ct =
        (y.referrer || '')
          .replace(v, ft)
          .replace(/^https?:\/\/((m|l|w{2,3}([0-9]+)?)\.)?([^?#]+)(.*)$/, '$4')
          .replace(/^([^/]+)$/, '$1') || h,
      Rt = 0,
      Ht = function (t, e) {
        var n;
        qt &&
          ((n = Z(dt, { type: 'append', original_id: e ? t : At.page_id })),
          tt('t') && (n.duration = Math.round((et() - gt - Rt) / 1e3)),
          (Rt = 0),
          (gt = et()),
          tt('scro') && (n.scrolled = Math.max(0, vt, Tt())),
          e || !g.sendBeacon ? pt(n, h, f) : g.sendBeacon(k + '/append', S(n)));
      };
    M(
      'visibilitychange',
      function () {
        y.hidden ? ('on' + P in l || Ht(), (jt = et())) : (Rt += et() - jt);
      },
      d,
    ),
      M(P, Ht, d);
    var Pt = y.body || {},
      Tt = function () {
        try {
          var t = q[H] || 0,
            e = Math.max(Pt[C] || 0, Pt[R] || 0, q[H] || 0, q[C] || 0, q[R] || 0);
          return Math.min(100, 5 * Math.round((100 * ((q.scrollTop || 0) + t)) / e / 5));
        } catch (ne) {
          return p(ne), 0;
        }
      };
    M('load', function () {
      (vt = Tt()),
        M(
          j,
          function () {
            vt < Tt() && (vt = Tt());
          },
          d,
        );
    });
    var Ut,
      It,
      Vt,
      Bt = function (t) {
        var e = '';
        try {
          e = t || x(s.pathname);
        } catch (ne) {
          p(ne);
        }
        var n = l[St];
        if (rt(n))
          try {
            e = n.call(l, { path: e }) || e;
          } catch (ne) {
            F('path', ne);
          }
        if (
          !(function (t) {
            for (var e in Et) {
              var n = Et[e];
              if (n) {
                var r = '/' == n[0] ? n : '/' + n;
                if (r === t || new RegExp('^' + G(r).replace(/\\\*/gi, '(.*)') + '$', 'i').test(t)) return f;
              }
            }
            return d;
          })(e)
        )
          return 'hash' == yt && s.hash && (e += s.hash.split('?')[0]), e;
        p(b + 'ignoring ' + e);
      },
      Nt = function (t, e, n) {
        var r = Bt(e);
        if (r && $t != r) {
          ($t = r),
            (Dt.path = r),
            tt('v') &&
              ((Dt.viewport_width = Math.max(q.clientWidth || 0, l.innerWidth || 0) || null),
              (Dt.viewport_height = Math.max(q[H] || 0, l.innerHeight || 0) || null)),
            tt('l') && g[A] && (Dt[A] = g[A]),
            N && tt('sc') && ((Dt.screen_width = N.width), (Dt.screen_height = N.height));
          var a,
            i = l.performance,
            o = 'navigation';
          try {
            a = i.getEntriesByType(o)[0].type;
          } catch (ne) {
            p(ne);
          }
          Vt = a ? -1 < ['reload', 'back_forward'].indexOf(a) : i && i[o] && -1 < [1, 2].indexOf(i[o].type);
          var c = Ct ? Ct.split('/')[0] : h;
          (It = Ct ? -1 < xt.indexOf(c) || c == v : d),
            (Dt.unique = t || Vt ? d : !It),
            (n = ct(n, { type: m, path: Dt.path }));
          var s = function () {
            (E = f),
              (function (t, e, n, r) {
                t && Ht('' + At.page_id, f), qt && (At.page_id = nt());
                var a = ft + Bt();
                pt({ id: At.page_id, type: m, referrer: !e || n ? Ct : null, query: ut(e), metadata: S(r) }),
                  (Ut = Ct),
                  (Ct = a),
                  V++;
              })(t, t || Vt || !tt('r'), It, n);
          };
          if (E) s();
          else
            try {
              D && rt(D.getHighEntropyValues)
                ? D.getHighEntropyValues([T, U])
                    .then(function (t) {
                      (At.os_name = t[T]), (At.os_version = t[U]), s();
                    })
                    ['catch'](s)
                : s();
            } catch (u) {
              s();
            }
        }
      },
      zt = l.history,
      Ft = zt ? zt.pushState : h,
      Wt = l.dispatchEvent,
      Gt = 'pushState';
    wt &&
      Ft &&
      Event &&
      Wt &&
      ((zt.pushState =
        ((te = zt[(Xt = Gt)]),
        function () {
          var t,
            e = arguments,
            n = te.apply(this, e);
          return (
            rt(Event) ? (t = new Event(Xt)) : (t = y.createEvent('Event')).initEvent(Xt, f, f),
            (t.arguments = e),
            Wt(t),
            n
          );
        })),
      M(
        Gt,
        function () {
          Nt(1);
        },
        d,
      ),
      M(
        'popstate',
        function () {
          Nt(1);
        },
        d,
      )),
      wt &&
        'hash' == yt &&
        'onhashchange' in l &&
        M(
          'hashchange',
          function () {
            Nt(1);
          },
          d,
        ),
      wt
        ? Nt()
        : (l.sa_pageview = function (t, e) {
            Nt(0, t, e);
          });
    var Jt = ['string', 'number'],
      Lt = function (t, e, n) {
        !n && rt(e) && (n = e);
        var r = rt(t),
          a = rt(n) ? n : function () {},
          i = typeof t;
        if (Jt.indexOf(i) < 0 && !r) return F(bt, u + " can't be " + i), a();
        try {
          if (r) {
            var o = t();
            if (Jt.indexOf(typeof o) < 0) return F(bt, t + ' returns no string: ' + o), a();
            t = o;
          }
        } catch (ne) {
          return F(bt, ne), a();
        }
        t = ('' + t).replace(/[^a-z0-9]+/gi, '_').replace(/(^_|_$)/g, '');
        var c = { type: u, event: t },
          s = !Vt && V < 2;
        (e = ct(e, c)),
          t && pt(Z(c, { id: nt(), query: ut(!s), referrer: (s || It) && tt('r') ? Ut : null, metadata: S(e) }), a);
      },
      Yt = function (t, e, n) {
        Lt(t, e, n);
      };
    l[bt] || (l[bt] = Yt);
    var Zt = l[bt],
      Kt = Zt && Zt.q ? Zt.q : [];
    for (var Qt in ((l[bt] = Yt), Kt)) W(Kt, Qt) && (Array.isArray(Kt[Qt]) ? Lt.apply(null, Kt[Qt]) : Lt(Kt[Qt]));
  } catch (re) {
    n(re);
  }
  var Xt, te, ee;
})(window, {}, 'simpleanalyticscdn.com');
//# sourceMappingURL=v11.js.map
