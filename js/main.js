if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var effectFXAA, camera, scene, renderer, composer, map,

   // some flavor text, not got the proper content yet
    rikerIndex = 0, rikerIpsum = [
   "What? We're not at all alike! For an android with no feelings, he sure managed to evoke them in others. I've had twelve years to think about it. And if I had it to do over again, I would have grabbed the phaser and pointed it at you instead of them. Did you come here for something in particular or just general Riker-bashing? Flair is what marks the difference between artistry and mere competence. I guess it's better to be lucky than good. When has justice ever been as simple as a rule book? Worf, It's better than music. It's jazz. We have a saboteur aboard.",
   "They were just sucked into space. Fear is the true enemy, the only enemy. I've had twelve years to think about it. And if I had it to do over again, I would have grabbed the phaser and pointed it at you instead of them. Maybe if we felt any human loss as keenly as we feel one of those close to us, human history would be far less bloody. Yesterday I did not know how to eat gagh. Mr. Worf, you sound like a man who's asking his friend if he can start dating his sister. Wait a minute - you've been declared dead. You can't give orders around here.",
   "I think you've let your personal feelings cloud your judgement. The look in your eyes, I recognize it. You used to have it for me. Commander William Riker of the Starship Enterprise. I guess it's better to be lucky than good. Our neural pathways have become accustomed to your sensory input patterns.",
   "We know you're dealing in stolen ore. But I wanna talk about the assassination attempt on Lieutenant Worf. Could someone survive inside a transporter buffer for 75 years? Why don't we just give everybody a promotion and call it a night - 'Commander'? Damage report! I can't. As much as I care about you, my first duty is to the ship. What? We're not at all alike! This should be interesting. Your head is not an artifact! Worf, It's better than music. It's jazz. Congratulations - you just destroyed the Enterprise. Our neural pathways have become accustomed to your sensory input patterns. What's a knock-out like you doing in a computer-generated gin joint like this? Captain, why are we out here chasing comets?"
];

init();
animate();

function init()
{
   var container, renderModel, effectCopy, effectBloom, width, height;

   container = document.createElement( 'div' );
   document.body.appendChild( container );
   width = window.innerWidth || 2;
   height = window.innerHeight || 2;

   camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
   camera.position.y = 400;
   camera.position.z = 600;
   camera.setViewOffset( width, height, 0, - ( height / 8 ), width, height );

   controls = new THREE.TrackballControls( camera );
   controls.rotateSpeed = 1.0;
   controls.zoomSpeed = 1.2;
   controls.panSpeed = 0.8;
   controls.noZoom = false;
   controls.noPan = false;
   controls.staticMoving = true;
   controls.dynamicDampingFactor = 0.3;
   controls.keys = [ 65, 83, 68 ];
   controls.addEventListener( 'change', render );

   scene = new THREE.Scene();

   renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: true } );
   renderer.setSize( window.innerWidth, window.innerHeight );
   renderer.autoClear = false;
   container.appendChild( renderer.domElement );

   map = new SCMAP.Map( scene, sc_map );
   buildReferencePlane();

   // Stats

   stats = new Stats();
   stats.domElement.style.position = 'absolute';
   stats.domElement.style.top = '0px';
   container.appendChild( stats.domElement );

   // Event handlers

   window.addEventListener( 'resize', onWindowResize, false );
   renderer.domElement.addEventListener( 'mousedown', onDocumentMouseUpAndDown, false );
   renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUpAndDown, false );

   // Rendering

   renderModel = new THREE.RenderPass( scene, camera );
   //effectBloom = new THREE.BloomPass( 1.3 );
   effectCopy = new THREE.ShaderPass( THREE.CopyShader );
   effectCopy.renderToScreen = true;

   //effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
   //effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width, 1 / height );

   composer = new THREE.EffectComposer( renderer );
   composer.addPass( renderModel );
   //composer.addPass( effectFXAA );
   //composer.addPass( effectBloom );
   composer.addPass( effectCopy );
}

function buildReferencePlane()
{
   var ringWidth = 52.5, // plane circle scaling to match the map
      rings = 18, // number of circles we'll create
      segments = 36, // radial segments
      radius = rings * ringWidth,
      material, referencePlane, geometry,
      step = 2 * Math.PI / segments,
      theta, x, z, i, point, color, distance, strength;

   material = new THREE.LineBasicMaterial( { color: 0xFFFFFF, linewidth: 1, vertexColors: true, opacity: 0.6 } ),
   geometry = new THREE.CylinderGeometry( radius, 0, 0, segments, rings, false );

   // create the lines from the center to the outside
   for ( theta = 0; theta < 2 * Math.PI; theta += step )
   {
      x = radius * Math.cos( theta );
      z = 0 - radius * Math.sin( theta );
      geometry.vertices.push( new THREE.Vector3( x, 0, z ) );
      geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
   }

   // assign colors to vertices based on their distance
   for ( var i = 0; i < geometry.vertices.length; i++ ) 
   {
      point = geometry.vertices[ i ];
      color = new THREE.Color( 0x000000 );
      strength = ( radius - point.length() ) / ( radius );
      color.setRGB( 0, strength * 0.8, 0 );
      geometry.colors[i] = color;
   }

   // and create the ground reference plane
   referencePlane = new THREE.Line( geometry, material ),
   referencePlane.overdraw = false;
   scene.add( referencePlane );
}

function onWindowResize()
{
   camera.aspect = window.innerWidth / window.innerHeight;
   camera.updateProjectionMatrix();

   renderer.setSize( window.innerWidth, window.innerHeight );

   //effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );

   composer.reset();
}

function onDocumentMouseUpAndDown( event )
{
   var vector, projector, raycaster, intersects, clickedOut;
   vector = new THREE.Vector3( (event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5 );
   projector = new THREE.Projector();
   projector.unprojectVector( vector, camera );
   raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
   intersects = raycaster.intersectObjects( map.interactables );
   map.handleSelection( event, intersects[0] );
}

function displaySystemInfo( system )
{
   $('#systemname').text( system + ' System' );
   var systemInfo = sc_system_info[ system ];
   if ( systemInfo === ' object' )
   {
      var blurb = $('<div class="sc_system_info '+system+'"></div>');
      blurb.append( '<dl></dl>' );
      var worlds = 'No inhabitable worlds';
      var _import = 'None';
      var _export = 'None';
      var black_market = 'None';
      if ( systemInfo.planetary_rotation.length ) {
         worlds = systemInfo.planetary_rotation.join( ', ' );
      }
      if ( systemInfo.import.length ) {
         _import = systemInfo.import.join( ', ' );
      }
      if ( systemInfo.export.length ) {
         _export = systemInfo.export.join( ', ' );
      }
      if ( systemInfo.black_market.length ) {
         black_market = systemInfo.black_market.join( ', ' );
      }
      blurb.find('dl').append(
         '<dt class="ownership">Ownership</dt><dd class="ownership">'+systemInfo.ownership+'</dd>' +
         '<dt class="planets">Planets</dt><dd class="planets">'+systemInfo.planets+'</dd>' +
         '<dt class="rotation">Planetary rotation</dt><dd class="rotation">'+worlds+'</dd>' +
         '<dt class="import">Import</dt><dd class="import">'+_import+'</dd>' +
         '<dt class="export">Export</dt><dd class="export">'+_export+'</dd>' +
         '<dt class="crime_'+systemInfo.crime_status.toLowerCase()+'">Crime status</dt><dd class="crime">'+systemInfo.crime_status+'</dd>' +
         '<dt class="black_market">Black market</dt><dd class="crime">'+black_market+'</dd>' +
         '<dt class="strategic_'+systemInfo.uue_strategic_value.toLowerCase()+'">UEE strategic value</dt><dd class="strategic">'+systemInfo.uue_strategic_value+'</dd>'
      );

      for ( var i = 0; i < systemInfo.blob.length; i++ ) {
         var blob = systemInfo.blob[i];
         blurb.append( '<p>' + blob + '</p>' );
      }

      if ( systemInfo.source ) {
         blurb.append( '<p><a href="' + systemInfo.source + '" target="_blank">(source)</a></p>' );
      }

      $('#systemblurb').empty();
      $('#systemblurb').append( blurb );
   }
   else
   {
      $('#systemblurb').html( "<strong>No data available yet</strong><br>Placeholder RikerIpsum text "
         + ( rikerIndex + 1 ) + "/" + rikerIpsum.length + ":<br>" + rikerIpsum[ rikerIndex++ ] );
      if ( rikerIndex >= rikerIpsum.length ) {
         rikerIndex = 0;
      }
   }
}

//

function animate() {
   requestAnimationFrame( animate );
   controls.update();
   stats.update();
   render();
}

function render() {
   map.animateSelector();
   renderer.clear();
   composer.render();
}

// End of file

