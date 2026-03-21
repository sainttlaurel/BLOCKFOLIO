module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      overrideBrowserslist: [
        'Chrome >= 90',
        'Edge >= 90',
        'Firefox >= 88',
        'Safari >= 14',
        'iOS >= 14',
        'Android >= 90'
      ]
    },
  },
}