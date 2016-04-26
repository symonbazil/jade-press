/*
tools
*/

'use strict'

const crypto = require('crypto')
let local = require('../app/local')
let setting = require('../app/setting')
let stylus = require('stylus')
let jade = require('jade')
let _ = require('lodash')

exports.replace = {
	':yyyy': function(url, item) {
		return url.replace( ':yyyy', item.createTime.getFullYear() )
	}
	,':mm': function(url, item) {
		var m = item.createTime.getMonth()
		m = m > 9?m + '':'0' + m
		return url.replace( ':mm',  m)
	}
	,':dd': function(url, item) {
		var d = item.createTime.getDate()
		d = d > 9?d + '':'0' + d
		return url.replace( ':mm',  d)
	}
	,':slug': function(url, item) {
		return url.replace( ':slug',  item.slug)
	}
	,':id': function(url, item) {
		return url.replace( ':id',  item.id)
	}
	,':_id': function(url, item) {
		return url.replace( ':_id',  item._id)
	}
	,':catSlug': function(url, item) {
		return url.replace( ':catSlug',  item.cats[0].slug)
	}
	,':catId': function(url, item) {
		return url.replace( ':catId',  item.cats[0].id)
	}
	,':cat_id': function(url, item) {
		return url.replace( ':cat_id',  item.cats[0]._id)
	}
}

exports.parseStylus = function(str) {
	return new Promise(function(resolve, reject) {
		stylus.render(str, function(err, css){
			if(err) reject(err)
			else resolve(css)
		})
	})
}

exports.parseJade = function(str, locals, options) {
	return new Promise(function(resolve, reject) {
		var fn = jade.compile(str, options || {})
		var html = fn(locals)
		resolve(html)
	})
}

exports.decipher = function(_encrypted) {

	const decipher = crypto.createDecipher('md5', setting.secret)
	let encrypted = _encrypted
	var decrypted = decipher.update(encrypted, 'hex', 'utf8')
	decrypted += decipher.final('utf8')
	
	return decrypted

}

exports.log = function() {
	console.log.apply(null, ['' + new Date()].concat(Array.from(arguments)))
}

exports.err = function() {
	console.error.apply(
		null, ['' + new Date()].concat(
			Array.from(arguments).map(function(v) {
				return v.stack || v
			})
		)
	)
}

exports.warn = function() {
	console.warn.apply(
		null, ['' + new Date()].concat(
			Array.from(arguments).map(function(v) {
				return v.stack || v
			})
		)
	)
}

exports.setNoCache = function* (next) {
	if( !/^\/api\//.test(this.path) ) this.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
	yield next
}

exports.loginCheck = function* (next) {

	let sess = this.session
	,path = this.path
	,redirect = '/'

	if(
		!sess.user && 
		/^\/su\//.test(path)
	) {
		sess.redirect = path
		return this.redirect(redirect)
	}

	else if(!sess.user && /^\/api\//.test(this.path)) return this.body = {
		code: 1
		,errorMsg: 'please login'
	}

	yield next

}

exports.authCheck = function* (next) {

	var path = this.path

	if(
		!/^\/su\//.test(path) || 
		!/^\/api\//.test(path)
	) return yield next

	var sess = this.session
	,user = sess.user || {}

	var authed = exports.checkPath(path, user.group)

	if(!authed && /^\/su\//.test(path)) return this.redirect('/')
	else if(!authed && /^\/api\//.test(path)) return this.body = {
		code: 1
		,errorMsg: 'not authorized'
	}

	yield next

}

exports.checkPath = function (path, group) {
	return group.access.indexOf(path) > -1
}

exports.init = function* (next) {


	let arr = this.href.split('/')
	,host = arr[0] + '//' + arr[2]
	,sess = this.session

	sess.state = sess.state || this.sessionId

	this.local = Object.assign({}, local, {
		host: host
		,state: sess.state
		,href: this.href
		,logined: false
		,path: this.path
	})

	if(!local.cdn) this.local.cdn = host

	if(setting.logOn) exports.log(
		this.method
		,this.href
		,this.headers['x-forwarded-for']
		,sess.user && sess.user.name
		,sess.user && sess.user.email
		,JSON.stringify(this.request.body)
	)

	return yield next
}



exports.createQueryObj = function(params, pick) {
	var replace = _.pick(exports.replace, pick)
	var res = false
	_.each(params, function(value, key) {
		var k = ':' + key
		if(replace[k]) {
			if(!res) res = {}
			res[key] = value
			return false
		}
	})
	return res
}

exports.createUrl = function(item, host, route) {
	var replace = exports.replace
	var reg = /(:[a-zA-Z_][a-zA-Z_1-9]{0,24})/g
	var rs = route.match(reg)
	var url = host + route
	for(var i = 0, len = rs.length;i < len;i ++) {
		var rp = rs[i]
		url = replace[rp](url, item)
	}
	return url
}