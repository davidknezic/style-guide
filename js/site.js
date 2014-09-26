(function() {
  (function($) {
    var Plugin, Site;
    Site = (function() {
      function Site(element, options) {
        ({
          DEFAULTS: {
            mask: false
          }
        });
        this.$element = $(element);
        this.options = $.extend({}, DEFAULTS, options);
      }

      Site.prototype.toggle = function(show) {};

      Site.prototype.show = function() {
        return toggle(true);
      };

      Site.prototype.hide = function() {
        return toggle(false);
      };

      return Site;

    })();
    Plugin = function(option) {
      return this.each(function() {
        var $this, data, options;
        $this = $(this);
        data = $this.data('bs.site');
        options = typeof option === 'object' && option;
        if (!data) {
          data = new Button(this, options);
          $this.data('bs.site', data);
        }
        if (option === 'toggle') {
          return data.toggle;
        } else if (option) {
          return data.setState(option);
        }
      });
    };
    $.fn.button = Plugin;
    return $.fn.button.Constructor = Button;
  })(jQuery);

}).call(this);

//# sourceMappingURL=site.js.map