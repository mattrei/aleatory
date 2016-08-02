const average = require('analyser-frequency-average')

export
default class AudioAnalyser {

    constructor(analyser) {
    	this.analyser = analyser

        this._createAudioTexture()

    }

    _createAudioTexture() {
        let size = 12;
        this.audioData = new Float32Array(size * size * 3);
        this.volume = 1;

        for (let i = 0, l = this.audioData.length; i < l; i += 3) {
            this.audioData[i] = 0.0;
            this.audioData[i + 1] = 0.0;
            this.audioData[i + 2] = 0.0;
        }
        this.textureAudio = new THREE.DataTexture(this.audioData, size, size, THREE.RGBFormat, THREE.FloatType);
        this.textureAudio.minFilter = this.textureAudio.maxFilter = THREE.NearestFilter;
    }

    getFreq(min, max) {
        if (!this.analyser) return random(min, max)

        return average(this.analyser.analyser, this.analyser.frequencies(), min, max)
    }

    getLowFreq() {
        return this.getFreq(20, 400)
    }

    getMidFreq() {
        return this.getFreq(400, 1500)
    }

    getHighFreq() {
        return this.getFreq(1500, 5000)
    }

    getAnalyser() {
        return this.analyser
    }

    getAudioTexture() {

        const freq = this.analyser.frequencies();
        let _acuteAverage = 0;
        let _volume = 0;
        for (let i = 0; i < freq.length; i++) {
            this.audioData[i] = freq[i] / 256.;
            _volume += freq[i] / 256.
            if(i > 174 - 5) {
                _acuteAverage += freq[i] / 256.;
            }
        }
        this.volume = _volume / freq.length;

        this.textureAudio.needsUpdate = true
        return this.textureAudio
    }

    getVolume() {
        return this.volume
    }


}