import pdf from '../icons/pdf.svg';
import img from '../icons/image.svg';
import rkt from '../icons/racket.svg';
import java from '../icons/java.svg';
import py from '../icons/python.svg';
import zip from '../icons/zip.svg';
import ppt from '../icons/powerpoint.svg';
import video from '../icons/video.svg';
import doc from '../icons/word.svg';

const icons = {
	pdf,
	img,
	rkt,
	java,
	py,
	zip,
	ppt,
	video,
	doc
};

export const iconMapping: { [key: string]: string | undefined } = {
	pdf: icons.pdf,
	png: icons.img,
	jpg: icons.img,
	jpeg: icons.img,
	gif: icons.img,
	rkt: icons.rkt,
	java: icons.java,
	py: icons.py,
	zip: icons.zip,
	pptx: icons.ppt,
	doc: icons.doc,
	docx: icons.doc,
	mp4: icons.video,
	mov: icons.video
};

export default icons;
