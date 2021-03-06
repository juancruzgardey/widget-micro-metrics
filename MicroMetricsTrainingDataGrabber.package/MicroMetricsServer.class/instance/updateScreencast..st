updating
updateScreencast: request
	| jsonBody screencastFound |
	jsonBody := NeoJSONReader fromString: request contents.
	screencastFound := Screencast
		selectOne: [ :screencast | screencast id = (jsonBody at: 'screencastId') ].
	screencastFound
		ifNil: [ screencastFound := Screencast
				id: (jsonBody at: 'screencastId')
				name: (jsonBody at: 'screencastName')].
		screencastFound addEvents: ((jsonBody at: 'events') collect: [ :eventDict | ScreencastEvent values: eventDict ]).
	self captureMetricFrom: (jsonBody at: 'metrics') for: screencastFound. 	
	screencastFound save.