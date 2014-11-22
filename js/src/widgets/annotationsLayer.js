(function($) {

  $.AnnotationsLayer = function(options) {

    jQuery.extend(true, this, {
      parent:            null,
      annotationsList:   null,
      viewer:            null,
      renderer:          null,
      selected:          null,
      hovered:           null,
      windowId:          null,
      mode:              null,
      annotator:         null,
      element:           null
    }, options);

    this.init();
  };

  $.AnnotationsLayer.prototype = {

    init: function() {
      var _this = this;
      if (this.element.data('annotator')) {
        this.annotator = this.element.data('annotator');
      } else {
        this.annotator = this.element.annotator().data('annotator');
      }
      this.createRenderer();
      this.annotator.addPlugin('Tags');
      this.bindEvents();
    },

    bindEvents: function() {
      var _this = this;

      jQuery.subscribe('modeChange.' + _this.windowId, function(event, modeName) {
        console.log('entered ' + modeName + ' mode in annotationsLayer');
        if (modeName === 'displayAnnotations') { _this.enterDisplayAnnotations(); }
        if (modeName === 'makeAnnotations') { _this.enterMakeAnnotations(); }
        if (modeName === 'default') { _this.enterDefault(); }
      });

      jQuery.subscribe('annotationListLoaded.' + _this.windowId, function(event) {
        _this.annotationsList = _this.parent.parent.annotationsList;
          _this.createRenderer();
      });

    },
    
    createRenderer: function() {
      var _this = this,
      modeName = _this.mode;
      this.renderer = $.OsdCanvasRenderer({
          osd: $.OpenSeadragon,
          viewer: _this.viewer,
          list: _this.annotationsList, // must be passed by reference.
          onHover: function(annotations) {
            var annotation = annotations[0];
            console.log(annotation);
            var position = _this.parseRegionForAnnotator(annotation.on);
            
            _this.annotator.showViewer(_this.prepareForAnnotator(annotation), position);
          },
          onMouseLeave: function() {
            _this.annotator.viewer.hide();
          },
          onSelect: function(annotation) {

          },
          visible: false
        });
        if (modeName === 'displayAnnotations') { _this.enterDisplayAnnotations(); }
        if (modeName === 'makeAnnotations') { _this.enterMakeAnnotations(); }
        if (modeName === 'default') { _this.enterDefault(); }
    },
    
    parseRegionForAnnotator: function(url) {
      var _this = this,
      regionString,
      regionArray,
      annotatorPosition;

      if (typeof url === 'object') {
        regionString = url.selector.value;  
      } else {
        regionString = url.split('#')[1];
      }
      regionArray = regionString.split('=')[1].split(',');

      // This positions the annotator pop-up directly below the 
      // annotation, adjusting the canvas panning so that it
      // will always be visible.
      
      var topLeftImagePoint = new OpenSeadragon.Point(+regionArray[0], +regionArray[1]);

      annotatorPosition = {
        top: _this.viewer.viewport.imageToViewerElementCoordinates(topLeftImagePoint).y,
        left: _this.viewer.viewport.imageToViewerElementCoordinates(topLeftImagePoint).x
      };

      return annotatorPosition;
    },

    prepareForAnnotator: function(oaAnnotation) {
      var annotatortion = {
        text: oaAnnotation.resource.chars
      };

      return [annotatortion];
    },

    enterDisplayAnnotations: function() {
      var _this = this;
      console.log('triggering annotation loading and display');
      this.renderer.render();
    },

    enterEditAnnotations: function() {
      console.log('triggering annotation editing');
      // this.renderer.update().showAll();
    },

    enterDefault: function() {
      console.log('triggering default');
      this.renderer.hideAll();
    },

    setVisible: function() {
      var _this = this;

      if (_this.get('visible') === false) {
        _this.set("visible", true);
      }  else {
        _this.set("visible", false);
      }
    },

    changePage: function() {
    },

    accentHovered: function(id, source) {
      var _this = this;

      if (source === 'listing') {
        _this.regionController.accentHovered(id);
      } else {
        _this.sidePanel.accentHovered(id);
      }
    },

    focusSelected: function(id, source) {
      var _this = this;

      _this.sidePanel.focusSelected(id, source);
      _this.regionController.focusSelected(id);
      _this.bottomPanel.focusSelected(id);
    },

    deselect: function() {
      var _this = this;

      _this.bottomPanel.deselect();
      _this.sidePanel.deselect();
      _this.regionController.deselect();
    },

    filterAnnotations: function(filter, options) {
      _this = this;

      filteredAnnos = jQuery.grep(_this.annotations, function(a) { return a.type !== filter; } ),
      filteredIds = jQuery.map(filteredAnnos, function(a) { return a.id; }),
      filteredRegions = jQuery.map(filteredIds, function(id) { 
        var idString = '#region_' + id;
        return jQuery(idString);
      }),
      filteredListings = jQuery.map(filteredIds, function(id) { 
        var idString = '#listing_' + id;
        return jQuery(idString);
      });

      _this.parent.element.find('.annotation').fadeIn();
      _this.parent.element.find('.annotationListing').slideDown();
      _this.bottomPanel.deselect();

      if (filter === '') { return; }

      jQuery(filteredRegions).map(function() { return this.toArray(); }).fadeOut();
      jQuery(filteredListings).map(function() { return this.toArray(); }).slideUp();
    }

  };

}(Mirador));
