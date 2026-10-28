import { useState } from 'react';
import './wanderer-mascot.css';

type Props = { hp: number; maxHp: number; rads: number };

/**
 * An original mid-century-inspired wasteland explorer, drawn as real SVG.
 * No unlicensed game sprites, remote images or paid assets are required.
 */
export default function WandererMascot({ hp, maxHp, rads }: Props) {
  const [saluting, setSaluting] = useState(false);
  const health = maxHp > 0 ? hp / maxHp : 0;
  const condition = health <= 0 ? 'offline' : health < 0.3 ? 'hurt' : rads >= 400 ? 'irradiated' : 'healthy';
  const diagnosis =
    condition === 'offline' ? 'NO VITAL SIGNAL' :
    condition === 'hurt' ? 'MEDICAL ATTENTION ADVISED' :
    condition === 'irradiated' ? 'RADIATION DETECTED' :
    saluting ? 'STAY SHARP, WANDERER!' : 'ALL VITAL SIGNS NOMINAL';

  return (
    <button
      className={'wanderer-portrait' + (saluting ? ' is-saluting' : '')}
      data-condition={condition}
      type="button"
      onClick={() => setSaluting((value) => !value)}
      aria-label={saluting ? 'Lower the wanderer’s hand' : 'Make the wanderer salute'}
      aria-pressed={saluting}
      title="Tap to make your wasteland explorer salute"
    >
      <svg className="wanderer-svg" viewBox="0 0 320 390" role="img" aria-label="Animated retro-futuristic wasteland explorer with a wrist computer and utility suit">
        <defs>
          <pattern id="wanderer-microgrid" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M14 0 H0 V14" stroke="currentColor" fill="none" strokeWidth=".42" opacity=".23" />
          </pattern>
          <pattern id="wanderer-stripe" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0 V7" stroke="currentColor" strokeWidth="2" opacity=".24" />
          </pattern>
        </defs>

        {/* The oscilloscope / biometric scanner is part of the illustration. */}
        <g className="wanderer-scanner" fill="none" stroke="currentColor">
          <circle cx="160" cy="174" r="144" strokeWidth=".75" opacity=".27" strokeDasharray="3 7" />
          <circle cx="160" cy="174" r="117" strokeWidth=".75" opacity=".12" />
          <circle cx="160" cy="174" r="91" strokeWidth=".65" opacity=".1" />
          <path d="M160 19V35 M160 309V325 M5 174H22 M298 174H315" strokeWidth="1.5" opacity=".4" />
          <path d="M27 86V63H50 M270 63h23v23 M27 270v20h23 M270 290h23v-20" strokeWidth="2" opacity=".36" />
          <path d="M20 322h280 M36 337h248" strokeWidth=".8" opacity=".20" />
          <path d="M61 356h35 M224 356h35" strokeWidth="1.3" opacity=".36" />
          <path d="M28 174h25l7-8 8 16 8-8h14" strokeWidth="1.5" opacity=".23" />
        </g>
        <circle className="wanderer-radar-ring" cx="160" cy="174" r="130"
          stroke="currentColor" strokeWidth="1.8" strokeDasharray="6 12"
          fill="none" opacity=".35" />
        <path className="wanderer-scan-sweep" d="M160 42A132 132 0 0 1 292 174"
          fill="none" stroke="currentColor" strokeWidth="3" opacity=".34" />

        <g className="wanderer-body" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {/* Legs, trousers, cuffs and exaggerated work boots. */}
          <g strokeWidth="3.5">
            <path d="M113 277L109 333L105 352L145 351L151 292 M166 291L174 352L215 353L206 332L200 278"
              fill="currentColor" fillOpacity=".12" />
            <path d="M110 318L147 320 M170 319L203 317 M120 284l-3 29 M190 285l5 29"
              fill="none" strokeWidth="2" opacity=".7" />
            <path d="M103 349Q91 353 84 364Q82 374 92 377H147L150 350Z"
              fill="currentColor" fillOpacity=".26" />
            <path d="M173 351L213 349Q223 359 236 364Q241 378 228 378H173Z"
              fill="currentColor" fillOpacity=".26" />
            <path d="M90 369h57 M178 371h54 M105 355h34 M184 355h27"
              fill="none" strokeWidth="2.4" />
            <path d="M112 329l37 3 M175 331l36-3" fill="none" strokeWidth="1.8" opacity=".5" />
          </g>

          {/* Underjacket and utility jumpsuit with piping. */}
          <g strokeWidth="4">
            <path d="M113 169Q91 180 83 202L77 266Q96 282 112 279L111 291Q159 309 207 290L204 277Q228 278 241 261L229 202Q218 180 197 169L180 160H133Z"
              fill="currentColor" fillOpacity=".11" />
            <path d="M113 176L129 194L157 218L182 191L198 176L205 290H111Z"
              fill="currentColor" fillOpacity=".10" />
            <path d="M133 172l25 43-14 14-31-46 M182 172l-24 43 15 14 29-46"
              fill="currentColor" fillOpacity=".20" strokeWidth="2.5" />
            <path d="M157 222L157 283 M122 225L122 277 M192 225L192 277"
              fill="none" strokeWidth="2.2" opacity=".7" />
            <path d="M112 277q47 10 94 0v14q-45 14-95-1z"
              fill="currentColor" fillOpacity=".3" />
            <rect x="148" y="273" width="22" height="17" rx="3" fill="currentColor" fillOpacity=".7" strokeWidth="2.4" />
            <path d="M156 280h6" stroke="#07180a" strokeWidth="2.5" />
            <path d="M122 238h25v24h-25z M174 238h25v24h-25z"
              fill="currentColor" fillOpacity=".13" strokeWidth="2" />
            <path d="M126 247h17 M178 247h17 M126 253h17 M178 253h17" strokeWidth="1" opacity=".65" />
            <path d="M133 211l24 12 24-12" strokeWidth="2" fill="none" opacity=".7" />
            <path d="M144 230h29" strokeWidth="1.5" opacity=".5" />
            <circle cx="159" cy="245" r="5" fill="currentColor" fillOpacity=".7" strokeWidth="1.5" />
            <circle cx="159" cy="261" r="3" fill="currentColor" strokeWidth="1.2" />
            <path d="M97 194l17 8 M207 203l21-9" strokeWidth="2.4" opacity=".55" />
          </g>

          {/* Left sleeve and gloved hand; visible wrist-mounted tech. */}
          <g strokeWidth="3.7">
            <path d="M93 193Q77 201 72 219L62 268Q61 284 75 291L90 284L102 234L111 206Z"
              fill="currentColor" fillOpacity=".15" />
            <path d="M70 269l24 7-8 24-25-8z" fill="currentColor" fillOpacity=".34" />
            <path d="M68 292q-7 9-4 23l10 11q7 4 11-3l10-24-13-7z"
              fill="currentColor" fillOpacity=".24" />
            <path d="M71 303l9 5 M70 311l8 4" strokeWidth="2" />
            <path d="M71 243l21 6 M66 261l28 8" strokeWidth="2" opacity=".65" />
            <path d="M62 260l32 9-5 20-31-9z" fill="currentColor" fillOpacity=".42" />
            <rect x="67" y="267" width="18" height="10" rx="2" strokeWidth="2" fill="#06170b" />
            <path d="M71 272h10" strokeWidth="1.6" />
          </g>

          {/* Raised right forearm and oversized thumbs-up glove. */}
          <g className="wanderer-gesture" strokeWidth="3.7">
            <path d="M221 195q19 8 24 28l5 17 18-14 16 15-25 33q-12 13-25 2l-23-40z"
              fill="currentColor" fillOpacity=".17" />
            <path d="M240 245l26-23 15 18-24 25z" fill="currentColor" fillOpacity=".35" />
            <path d="M263 231q-7-14 1-29l6-12q6-7 13-1q5 5 2 12l-5 13q13-7 20 2q5 8-2 14q7 7 0 15q3 8-6 13q-8 9-21 2l-17-13z"
              fill="currentColor" fillOpacity=".30" />
            <path d="M280 216l8 2 M278 228l13 2 M278 240l11 3" strokeWidth="2" opacity=".75" />
            <path d="M270 187q7-7 13-1 M252 202l-4-7 M286 205l9-4" strokeWidth="1.5" fill="none" />
          </g>

          {/* Collar, neck scarf and utility nameplate. */}
          <path d="M131 153v22l26 18 26-18v-22" fill="currentColor" fillOpacity=".2" strokeWidth="3.5" />
          <path d="M130 172l27 19 26-19" fill="none" strokeWidth="2.1" />
          <path d="M185 215h19v13h-19z" fill="currentColor" fillOpacity=".30" strokeWidth="2" />
          <path d="M190 219h10m-10 4h8" strokeWidth="1.4" />
          <circle cx="117" cy="211" r="4" fill="currentColor" fillOpacity=".5" strokeWidth="1.8" />

          {/* Oversized cartoon head, ears and chin. */}
          <g className="wanderer-head" strokeWidth="3.8">
            <path d="M105 94q-19-8-22 9q-2 18 20 24M206 96q20-8 24 8q1 17-23 23"
              fill="currentColor" fillOpacity=".2" />
            <path d="M102 79Q96 46 116 34Q143 17 176 30Q219 36 214 89L211 122Q207 160 172 173Q153 180 130 168Q99 153 101 117Z"
              fill="#07180a" />
            <path d="M108 109q1 37 24 51q23 18 48 5q27-14 27-52"
              fill="currentColor" fillOpacity=".085" strokeWidth="1.4" />
            <path d="M101 87q-8-12-6-27q1-23 24-32q12-24 42-17q31-5 43 18q23 10 19 31q-2 25-19 31q-10-10-9-30q-21 7-36 5q-24 11-48 6l-10 19z"
              fill="currentColor" fillOpacity=".65" />
            <path d="M104 58Q120 25 153 28Q177 29 187 44 M119 44q-9 11-10 22"
              fill="none" stroke="#07180a" strokeWidth="3" opacity=".78" />
            <path d="M131 35q18-20 46-7" fill="none" strokeWidth="2" opacity=".35" />
            <path d="M103 93q-6-16-2-29 M207 92q7-11 8-25"
              fill="none" strokeWidth="2" opacity=".6" />
            <path d="M129 89q13-6 25 0 M174 88q13-6 25 1" fill="none" strokeWidth="3.2" />
            <g className="wanderer-eyes" strokeWidth="3">
              <path d="M133 101q8-8 18 0 M178 100q9-7 18 1" fill="none" />
              <circle cx="143" cy="103" r="3.1" fill="currentColor" strokeWidth="0" />
              <circle cx="188" cy="103" r="3.1" fill="currentColor" strokeWidth="0" />
            </g>
            <path d="M164 104q-4 15-6 21q7 6 13 0" fill="none" strokeWidth="2.5" />
            <path d="M131 126q-5 2-7 8 M200 127q5 2 5 8" fill="none" strokeWidth="1.8" opacity=".5" />
            {condition === 'hurt' || condition === 'offline' ? (
              <path className="wanderer-mouth" d="M145 147q18-14 37 1" fill="none" strokeWidth="3.2" />
            ) : (
              <>
                <path className="wanderer-mouth" d="M137 138q29 26 56-1q-11 30-29 29q-17 0-27-28z"
                  fill="currentColor" fillOpacity=".13" strokeWidth="2.9" />
                <path d="M148 147q16 9 34-1" fill="none" strokeWidth="2" />
              </>
            )}
            <path d="M111 119q3 15 9 19 M206 117q-3 15-9 20" fill="none" strokeWidth="1.3" opacity=".45" />
          </g>
        </g>

        {/* UI flourishes sit above the sprite, like a real field terminal. */}
        <g className="wanderer-signal-markers" stroke="currentColor" fill="none" strokeWidth="1.6" opacity=".75">
          <path d="M19 46v-16h17 M284 30h17v16" />
          <path d="M17 337v19h19 M283 356h18v-19" />
          <path d="M42 46h23M255 46h23" strokeWidth="1" opacity=".5" />
        </g>
        <g className="wanderer-stars" fill="currentColor">
          <path d="M244 93l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".5" />
          <circle cx="58" cy="127" r="2" opacity=".4" />
          <circle cx="260" cy="305" r="1.6" opacity=".5" />
        </g>
      </svg>
      <span className="wanderer-diagnostic">
        <span className="wanderer-diagnostic-dot" aria-hidden="true" />
        {diagnosis}
      </span>
      <span className="wanderer-hint">{saluting ? 'TAP TO STAND DOWN' : 'TAP TO SALUTE'}</span>
    </button>
  );
}
