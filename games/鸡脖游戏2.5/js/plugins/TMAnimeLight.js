//=============================================================================
// TMPlugin - アニメ付き明かり
// バージョン: 2.0.1
// 最終更新日: 2016/12/02
// 配布元    : http://hikimoki.sakura.ne.jp/
//-----------------------------------------------------------------------------
// Copyright (c) 2016 tomoaky
// Released under the MIT license.
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc 在事件中显示带动画的灯光。
 *
 * @author tomoaky (http://hikimoki.sakura.ne.jp/)
 *
 * @param range
 * @text 动画范围
 * @desc 动画范围的大小。
 * 初始值: 0.1 (0.1 加减10%的缩放动画)
 * @default 0.1
 *
 * @param defaultZ
 * @text 默认Z坐标
 * @desc 动画的z坐标。
 * 初始值: 4
 * @default 4
 *
 * @param frames
 * @text 帧数
 * @desc 用于动画的帧数。
 * 初始值: 30
 * @default 30
 *
 * @help
 * 准备:
 *
 *   将随插件分发的灯光图像保存在img/system文件夹中。
 *   文件名可以自由更改。
 *   无论使用什么图像，都可以为每个事件显示不同的图像。
 *
 *
 * 使用方法:
 *
 *   在事件的备注栏中写入<animeLight:文件名>的标签，
 *   即可显示灯光。
 *
 *   灯光的位置也可以使用标签进行调整。
 *
 *   此插件已使用RPG Maker MV版本1.3.4进行了测试。
 *
 *
 * 备注栏标签（事件）:
 *
 *   <animeLight:TMAnimeLight1 192 24 -44 4>
 *     将图像TMAnimeLight1.png显示为不透明度192，在从事件脚下向右偏移24个点，
 *     向上偏移44个点、z坐标4的位置显示。
 *     最大不透明度为255。
 *
 *   除了事件的备注栏外，
 *   还可以在事件指令的【注释】设置相同的标签。
 *   如果备注栏和注释中都有标签，则注释优先。
 *
 *
 * 插件命令:
 *
 *   animeLight 1 TMAnimeLight1 255 0 -44 4
 *     将灯光应用于事件1。
 *     依次设置件编号、文件名、不透明度、x坐标校正、y坐标校正、z坐标。
 *     如果省略z坐标，则使用插件参数【默认Z坐标】的值。
 *     使用します。
 *
 *   animeLight 1
 *     删除事件编号1的灯光。
 *
 *   事件编号(第一个数值)根据以下规则设置目标。
 *     -1     … 以玩家为目标
 *     0      … 以正在执行命令的事件为目标
 *     1 以上 … 以那个编号的事件为目标
 *
 *
 * 实用功能:
 *
 *   所有备注栏标签、注释和插件命令都通用，
 *   可以在z坐标后添加数字1来显示没有动画的图像。
 *   例: <animeLight:TMAnimeLight1 192 0 0 4 1>
 *    在这种情况下，Z坐标不能省略。
 *
 *
 * 插件参数补充:
 *
 *   defaultZ
 *     设置灯光的显示顺序，
 *     这决定了它们是显示在事件的下方还是上方。
 *     0 … 优先级低于『在人物下方』
 *     2 … 优先级低于『与人物相同』
 *     4 … 优先级高于『与人物相同』
 *     6 … 优先级高于『在人物上方』
 */

var Imported = Imported || {};
Imported.TMAnimeLight = true;

var TMPlugin = TMPlugin || {};
TMPlugin.AnimeLight = {};
TMPlugin.AnimeLight.Parameters = PluginManager.parameters('TMAnimeLight');
TMPlugin.AnimeLight.Range = +(TMPlugin.AnimeLight.Parameters['range'] || 0.1);
TMPlugin.AnimeLight.DefaultZ = +(TMPlugin.AnimeLight.Parameters['defaultZ'] || 4);
TMPlugin.AnimeLight.Frames = +(TMPlugin.AnimeLight.Parameters['frames'] || 30);

if (!TMPlugin.EventBase) {
  TMPlugin.EventBase = true;
  (function() {

    var _Game_Event_setupPage = Game_Event.prototype.setupPage;
    Game_Event.prototype.setupPage = function() {
      _Game_Event_setupPage.call(this);
      if (this._pageIndex >= 0) this.loadCommentParams();
    };

    Game_Event.prototype.loadCommentParams = function() {
      this._commentParams = {};
      var re = /<([^<>:]+)(:?)([^>]*)>/g;
      var list = this.list();
      for (var i = 0; i < list.length; i++) {
        var command = list[i];
        if (command && command.code == 108 || command.code == 408) {
          for (;;) {
            var match = re.exec(command.parameters[0]);
            if (match) {
              this._commentParams[match[1]] = match[2] === ':' ? match[3] : true;
            } else {
              break;
            }
          }
        } else {
          break;
        }
      }
    };

    Game_Event.prototype.loadTagParam = function(paramName) {
      return this._commentParams[paramName] || this.event().meta[paramName];
    };

  })();
} // TMPlugin.EventBase

if (!TMPlugin.InterpreterBase) {
  TMPlugin.InterpreterBase = true;
  (function() {

    Game_Interpreter.prototype.convertEscapeCharactersTM = function(text) {
      text = text.replace(/\\/g, '\x1b');
      text = text.replace(/\x1b\x1b/g, '\\');
      text = text.replace(/\x1bV\[(\d+)\]/gi, function() {
        return $gameVariables.value(parseInt(arguments[1]));
      }.bind(this));
      text = text.replace(/\x1bV\[(\d+)\]/gi, function() {
        return $gameVariables.value(parseInt(arguments[1]));
      }.bind(this));
      text = text.replace(/\x1bN\[(\d+)\]/gi, function() {
        return this.actorNameTM(parseInt(arguments[1]));
      }.bind(this));
      text = text.replace(/\x1bP\[(\d+)\]/gi, function() {
        return this.partyMemberNameTM(parseInt(arguments[1]));
      }.bind(this));
      text = text.replace(/\x1bG/gi, TextManager.currencyUnit);
      return text;
    };
  
    Game_Interpreter.prototype.actorNameTM = function(n) {
      var actor = n >= 1 ? $gameActors.actor(n) : null;
      return actor ? actor.name() : '';
    };

    Game_Interpreter.prototype.partyMemberNameTM = function(n) {
      var actor = n >= 1 ? $gameParty.members()[n - 1] : null;
      return actor ? actor.name() : '';
    };

  })();
} // TMPlugin.InterpreterBase

(function() {

  //-----------------------------------------------------------------------------
  // Game_Temp
  //
  
  var _Game_Temp_initialize = Game_Temp.prototype.initialize;
  Game_Temp.prototype.initialize = function() {
    _Game_Temp_initialize.call(this);
    this.createAnimeLightSinTable();
  };

  Game_Temp.prototype.createAnimeLightSinTable = function() {
    this._animeLightSinTable = [];
    for (var i = 0; i < TMPlugin.AnimeLight.Frames; i++) {
      this._animeLightSinTable[i] = Math.sin(Math.PI * i / (TMPlugin.AnimeLight.Frames / 2)) *
                                    TMPlugin.AnimeLight.Range + 1;
    }
  };
  
  Game_Temp.prototype.animeLightSin = function(index) {
    return this._animeLightSinTable[index];
  };
  
  //-----------------------------------------------------------------------------
  // Game_CharacterBase
  //

  Game_CharacterBase.prototype.requestAnimeLight = function() {
    this._requestAnimeLight = true;
  };

  Game_CharacterBase.prototype.onChangeAnimeLight = function() {
    this._requestAnimeLight = false;
  };

  Game_CharacterBase.prototype.isAnimeLightRequested = function() {
    return this._requestAnimeLight;
  };

  //-----------------------------------------------------------------------------
  // Game_Event
  //

  var _Game_Event_setupPage = Game_Event.prototype.setupPage;
  Game_Event.prototype.setupPage = function() {
    _Game_Event_setupPage.call(this);
    if (this._pageIndex >= 0) {
      var animeLight = this.loadTagParam('animeLight');
      if (animeLight) {
        var arr = animeLight.split(' ');
        this._animeLight = arr[0];
        this._animeLightOpacity = arr[1] || 255;
        this._animeLightShiftX  = arr[2] || 0;
        this._animeLightShiftY  = arr[3] || 0;
        this._animeLightZ       = arr[4] || TMPlugin.AnimeLight.DefaultZ;
        this._animeLightNone    = arr[5] === '1';
      }
    } else {
      this._animeLight = '';
      this._animeLightOpacity = 255;
      this._animeLightShiftX = 0;
      this._animeLightShiftY = 0;
      this._animeLightZ = TMPlugin.AnimeLight.DefaultZ;
      this._animeLightNone = false;
    }
    this.requestAnimeLight();
  };
  
  //-----------------------------------------------------------------------------
  // Game_Interpreter
  //

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'animeLight') {
      var arr = args.map(this.convertEscapeCharactersTM, this);
      var character = this.character(+arr[0]);
      if (character) {
        character._animeLight = arr[1];
        character._animeLightOpacity = arr[2] || 255;
        character._animeLightShiftX  = arr[3] || 0;
        character._animeLightShiftY  = arr[4] || 0;
        character._animeLightZ       = arr[5] || TMPlugin.AnimeLight.DefaultZ;
        character._animeLightNone    = arr[6] === '1';
        character.requestAnimeLight();
      }
    }
  };
  
  //-----------------------------------------------------------------------------
  // Sprite_Character
  //

  var _Sprite_Character_update = Sprite_Character.prototype.update;
  Sprite_Character.prototype.update = function() {
    _Sprite_Character_update.call(this);
    this.updateAnimeLight();
  };

  Sprite_Character.prototype.updateAnimeLight = function() {
    if (this._character.isAnimeLightRequested() ||
        this._animeLight !== this._character._animeLight) {
      this._character.onChangeAnimeLight();
      this._animeLight = this._character._animeLight;
      if (this._animeLight) {
        if (!this._animeLightSprite) {
          this._animeLightSprite = new Sprite_AnimeLight(this);
          this.parent.addChild(this._animeLightSprite);
        }
        this._animeLightSprite.refresh(this._animeLight);
      } else {
        this.parent.removeChild(this._animeLightSprite);
        this._animeLightSprite = null;
      }
    }
  };

  //-----------------------------------------------------------------------------
  // Sprite_AnimeLight
  //

  function Sprite_AnimeLight() {
    this.initialize.apply(this, arguments);
  }

  Sprite_AnimeLight.prototype = Object.create(Sprite.prototype);
  Sprite_AnimeLight.prototype.constructor = Sprite_AnimeLight;

  Sprite_AnimeLight.prototype.initialize = function(characterSprite) {
    Sprite.prototype.initialize.call(this);
    this._characterSprite = characterSprite;
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.blendMode = 1;
    this._animeCount = 0;
  };

  Sprite_AnimeLight.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.x = this._characterSprite.x + this._shiftX;
    this.y = this._characterSprite.y + this._shiftY;
    if (!this._characterSprite._character._animeLightNone) {
      this._animeCount++;
      if (this._animeCount === TMPlugin.AnimeLight.Frames) this._animeCount = 0;
      var n = $gameTemp.animeLightSin(this._animeCount);
      this.scale.set(n, n);
    }
  };

  Sprite_AnimeLight.prototype.refresh = function(fileName) {
    this.bitmap = ImageManager.loadSystem(fileName);
    this.opacity = +this._characterSprite._character._animeLightOpacity;
    this._shiftX = +this._characterSprite._character._animeLightShiftX;
    this._shiftY = +this._characterSprite._character._animeLightShiftY;
    this.x = this._characterSprite.x + this._shiftX;
    this.y = this._characterSprite.y + this._shiftY;
    this.z = +this._characterSprite._character._animeLightZ;
  };
  
})();
