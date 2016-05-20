'use strict'

let config = require('../config')
,port = config.port
,host = 'http://127.0.0.1:' + port
,test = {
	title: 'single post'
	,waitForElementVisible: '#wrapper'
	,elementPresent: '#nav'
	,containsText: ['h1', 'hello, jadepress!']
	,elementCount: ['h1', 1]
	,url: 'http://127.0.0.1:' + port + '/default/hello-slug'
}

//disable
exports['@disabled'] = 0

exports[test.title] = function(browser) {
	browser
		.url(test.url)
		.waitForElementVisible(test.waitForElementVisible, 5000)
		.assert.elementPresent(test.elementPresent)
		.assert.containsText(test.containsText[0], test.containsText[1])
		.assert.elementCount(test.elementCount[0], test.elementCount[1])
		.end()
}
