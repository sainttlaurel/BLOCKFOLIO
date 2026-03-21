/**
 * Promise Polyfill
 * 
 * Provides Promise functionality for browsers that don't support it
 * Minimal implementation for basic Promise operations
 */

if (typeof window !== 'undefined' && typeof Promise === 'undefined') {
  class PromisePolyfill {
    constructor(executor) {
      this.state = 'pending';
      this.value = undefined;
      this.handlers = [];
      
      try {
        executor(
          value => this.resolve(value),
          reason => this.reject(reason)
        );
      } catch (error) {
        this.reject(error);
      }
    }

    resolve(value) {
      if (this.state !== 'pending') return;
      
      this.state = 'fulfilled';
      this.value = value;
      this.handlers.forEach(handler => this.handle(handler));
    }

    reject(reason) {
      if (this.state !== 'pending') return;
      
      this.state = 'rejected';
      this.value = reason;
      this.handlers.forEach(handler => this.handle(handler));
    }

    handle(handler) {
      if (this.state === 'pending') {
        this.handlers.push(handler);
      } else {
        if (this.state === 'fulfilled' && handler.onFulfilled) {
          handler.onFulfilled(this.value);
        }
        if (this.state === 'rejected' && handler.onRejected) {
          handler.onRejected(this.value);
        }
      }
    }

    then(onFulfilled, onRejected) {
      return new PromisePolyfill((resolve, reject) => {
        this.handle({
          onFulfilled: value => {
            if (!onFulfilled) {
              resolve(value);
            } else {
              try {
                resolve(onFulfilled(value));
              } catch (error) {
                reject(error);
              }
            }
          },
          onRejected: reason => {
            if (!onRejected) {
              reject(reason);
            } else {
              try {
                resolve(onRejected(reason));
              } catch (error) {
                reject(error);
              }
            }
          }
        });
      });
    }

    catch(onRejected) {
      return this.then(null, onRejected);
    }

    finally(onFinally) {
      return this.then(
        value => {
          onFinally();
          return value;
        },
        reason => {
          onFinally();
          throw reason;
        }
      );
    }

    static resolve(value) {
      return new PromisePolyfill(resolve => resolve(value));
    }

    static reject(reason) {
      return new PromisePolyfill((_, reject) => reject(reason));
    }

    static all(promises) {
      return new PromisePolyfill((resolve, reject) => {
        if (promises.length === 0) {
          resolve([]);
          return;
        }
        
        const results = [];
        let completed = 0;
        
        promises.forEach((promise, index) => {
          PromisePolyfill.resolve(promise).then(
            value => {
              results[index] = value;
              completed++;
              if (completed === promises.length) {
                resolve(results);
              }
            },
            reject
          );
        });
      });
    }

    static race(promises) {
      return new PromisePolyfill((resolve, reject) => {
        promises.forEach(promise => {
          PromisePolyfill.resolve(promise).then(resolve, reject);
        });
      });
    }
  }

  window.Promise = PromisePolyfill;
  console.log('✅ Promise polyfill loaded');
}

export default {};
