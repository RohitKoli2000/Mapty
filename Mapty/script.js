'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  #date = new Date();
  id = (Date.now() + '').slice(-5);
  #clicks = 0;

  constructor(cordinates, distance, duration) {
    // date = ...;
    // id = ...;
    this.cordinate = cordinates; //[lat,lan]
    this.distance = distance; //kh
    this.duration = duration; //min
  }

  _getDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = ` ${this.type[0].toUpperCase()}${this.type.slice(
      1
    )} on ${months[this.#date.getMonth()]} ${this.#date.getDate()}`;
    return this.description;
  }

  // click() {
  //   return this.#clicks++;
  // }
}

//Running_childClass:
class Running extends Workout {
  type = 'running';
  constructor(cordinates, distance, duration, cadence) {
    super(cordinates, distance, duration);
    this.cadence = cadence;
    this.#calcPace();
    this._getDescription();
  }

  #calcPace() {
    this.Pace = this.duration / this.distance;
    return this.Pace;
  }
}

//Cycling_childClass:
class Cycling extends Workout {
  type = 'cycling';
  constructor(cordinates, distance, duration, elevationGain) {
    super(cordinates, distance, duration);
    this.elevationGain = elevationGain;
    this.#calcElevationGain();
    this._getDescription();
  }

  #calcElevationGain() {
    this.speed = this.distance / (this.duration / 60); // to convert in hours
    return this.speed;
  }
}

/// Test Data:
/*
const run1 = new Running([34, -13], 15, 55, 55);
const cycling1 = new Cycling([314, -113], 25, 15, 655);

console.log(run1, cycling1);
*/

/////////////////////////////////////////////////////////////////////////
// Application Architecture:
class APP {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];

  //Helper Function:
  checkInput(...input) {
    return input.every(inp => Number.isFinite(inp));
  }

  inputPositiveNum(...input) {
    return input.every(inp => inp > 0);
  }

  //Display Marker:
  #renderWorkoutMarker(workout) {
    L.marker(workout.cordinate)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  //Display Form:
  #renderForm(workout) {
    let HTML = ` 
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

    if (workout.type === 'running') {
      HTML += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.Pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
    }

    if (workout.type === 'cycling') {
      HTML += `
        <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
              </div>
            </li>
        `;
    }

    form.insertAdjacentHTML('afterend', HTML);
  }

  //View Marker Position:
  #viewPopupMarker(e) {
    const workoutEL = e.target.closest('.workout');
    // console.log(workoutEL);

    if (!workoutEL) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEL.dataset.id
    );
    // console.log(workout);

    this.#map.setView(workout.cordinate, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout.click();
  }

  //Storing Data at Local Storage:
  #setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }

  //geting(Restoring) Data from Local Storage:
  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => this.#renderForm(work));
  }

  // Reset the Form Data:
  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }

  //////////////////////////////////////////////////////
  constructor() {
    this.#getPosition();
    this.#getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleElevationField);
    containerWorkouts.addEventListener(
      'click',
      this.#viewPopupMarker.bind(this)
    );
  }

  #getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert("Current Loaction can't be found");
        }
      );
  }

  #loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const cordinate = [latitude, longitude];
    this.#map = L.map('map').setView(cordinate, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this.#showForm.bind(this));

    this.#workouts.forEach(work => this.#renderWorkoutMarker(work));
  }

  #showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #hideForm() {
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ' ';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  #toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;

      // if (
      //   !Number.isFinite(distance) ||
      //   !Number.isFinite(duration) ||
      //   !Number.isFinite(cadence)
      // )
      //   return alert('Input a Positive Number');

      if (
        !this.checkInput(distance, duration, cadence) ||
        !this.inputPositiveNum(distance, duration, cadence)
      )
        return alert('Input a Positive Number');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !this.checkInput(distance, duration, elevation) ||
        !this.inputPositiveNum(distance, duration)
      )
        return alert('Input a Positive Number');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // creating Workouts:
    this.#workouts.push(workout);
    // console.log(this.#workouts);

    // Rendering Form:
    this.#renderForm(workout);

    // clear data & hide form :
    this.#hideForm();

    this.#renderWorkoutMarker(workout);

    this.#setLocalStorage();
  }
}

const app = new APP();
