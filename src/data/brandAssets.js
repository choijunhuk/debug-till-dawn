// simple-icons 패키지 자체는 자유 라이선스지만, 각 브랜드 로고의 상표권은 별개.
// 본 프로젝트는 개인용/비공개 전제. 공개·수익화 시 이 파일을 오마주(오리지널) 아이콘으로 교체할 것.
//
// 로고 교체는 여기 한 곳만: 키 → simple-icon 매핑만 바꾸면 게임 전체 아이콘이 교체됨.
// config(weapons/enemies/ui)는 icon "키"만 참조하고 svg/경로는 절대 하드코딩하지 않음.
import { siGit, siDocker, siKubernetes, siNpm, siNodedotjs, siPython, siJavascript, siTypescript, siRust, siCplusplus, siGithub, siGnubash, } from 'simple-icons';
// 키 = config 의 icon 키. 없는 키(java/c/http/cron/regex 등)는 도형 fallback.
export const brandAssets = {
    git: siGit, docker: siDocker, k8s: siKubernetes,
    npm: siNpm, node: siNodedotjs,
    py: siPython, js: siJavascript, ts: siTypescript, rust: siRust, cpp: siCplusplus,
    github: siGithub, linux: siGnubash, // sudo/터미널 계열
};
// 등록된 로고 텍스처 키 반환. 없으면 null → 호출부가 도형 fallback 사용.
export function logoTexture(key) {
    return key && brandAssets[key] ? `logo_${key}` : null;
}
