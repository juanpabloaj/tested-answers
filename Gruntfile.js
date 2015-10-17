module.exports = function(grunt) {
  grunt.initConfig({
    bowercopy: {
      js:{
        options: {
          destPrefix: 'public/js'
        },
        files: {
          'markdown.js': 'markdown/lib/markdown.js',
          'prism.js': 'prism/prism.js',
          'prism-python.min.js': 'prism/components/prism-python.min.js',
          'prism-elixir.min.js': 'prism/components/prism-elixir.min.js'
        }
      },
      css:{
        options: {
          destPrefix: 'public/css'
        },
        files: {
          'prism.css': 'prism/themes/prism.css',
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-bowercopy');
};
