baselines
baseline: spec
	<baseline>
	spec
		for: #common
		do: [ self
				seaside: spec;
				bootstrap: spec;
				teapot: spec;
				voyage: spec;
				neoCSV: spec.
			spec
				package: 'MicroMetricsTrainingDataGrabber'
				with: [ spec requires: #('Seaside3' 'Bootstrap' 'Teapot' 'Voyage' 'NeoCSV') ].
			spec postLoadDoIt: #postLoadActions ]